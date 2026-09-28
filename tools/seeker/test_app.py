import tempfile, unittest
from pathlib import Path
from PIL import Image
from app import Desk, naming, clean, filename_slug

class SeekerTests(unittest.TestCase):
    def test_requires_full_match_and_field_quotes(self):
        d={'description':'Painting of a Red House','title':'Red House','artist':'Jane Doe','year':'1920','support':[{'field':k,'source':0,'quote':'Red House by Jane Doe (1920)'} for k in ('title','artist','year')]}
        sources=[{'title':'Red House by Jane Doe (1920)','match':'full'}]
        self.assertEqual(naming(d,sources),('Red House by Jane Doe (1920)','source-supported'))
        self.assertEqual(naming(d,[])[1],'description-only')
        sources[0]['match']='partial'
        self.assertEqual(naming(d,sources)[1],'description-only')
        sources[0]['match']='full';d['artist']='Invented Artist'
        self.assertEqual(naming(d,sources)[0],'Red House (1920)')
    def test_rejects_gibberish_placeholder_and_long_utf8(self):
        with self.assertRaises(ValueError): naming({'description':'Untitled'},[])
        self.assertLessEqual(len(clean('猫'*200).encode()),190)
        self.assertNotIn('/',clean('../../Name'))
        self.assertEqual(filename_slug('The Valley of Silent Men by Dean Cornwell.jpg'), 'the_valley_of_silent_men_by_dean_cornwell.jpg')
    def test_resume_export_collision_and_originals(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);folder=root/'images';folder.mkdir()
            for n in ('a.png','b.png'): Image.new('RGB',(4,4),'red').save(folder/n)
            (folder/'readme.pdf').write_bytes(b'test')
            desk=Desk(folder,root/'state');self.assertEqual(len(desk.rows()),2);self.assertEqual(len(desk.skipped),1)
            for row in desk.rows(): desk.update(row['id'],status='ready',proposed='Painting of Red Squares.png',approved=1)
            dest=Path(desk.export());self.assertEqual(len(list(dest.glob('*.png'))),2)
            self.assertEqual(len(list(folder.glob('*.png'))),2)
            desk.db.close();desk=Desk(folder,root/'state');self.assertTrue(all(r['approved'] for r in desk.rows()))
            (folder/'a.png').write_bytes(b'changed')
            with self.assertRaises(ValueError): desk.export()
    def test_search_failure_does_not_call_classifier(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder=Path(tmp)/'images';folder.mkdir();Image.new('RGB',(4,4)).save(folder/'x.png')
            desk=Desk(folder,Path(tmp)/'state',key='test')
            with self.assertRaisesRegex(Exception,'Reverse search needs'): desk.start('reverse')
            self.assertFalse(desk.running);self.assertEqual(desk.rows()[0]['status'],'queued')

if __name__=='__main__': unittest.main()
